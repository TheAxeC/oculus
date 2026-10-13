// Layer 2, server test. The debug adapters of an app's host over the real runner: the debug client
// (lib/server/machine/debug/session.ts) runs a session against the adapter of the debugger
// `notes.dbg` that a factory describes as an executable, a server or an inline implementation, or
// that the manifest names, and the controls follow what the adapter declared. These are the debug
// rows of G77 (the app's contribution acts within its own ids) and G75 (the host runs while the app
// acts).
//
// The adapter is a node program that speaks the debug protocol and records every request
// (tests/server/machine/apps/world/debug-app.ts). Every folder is under the system temporary
// directory. What this does NOT cover: the pages' Debug view, Call Stack and Variables, which draw
// the state this test reads; the oculus adapter itself, which tests/server/machine/debug covers.
// @module-tag slow: each case starts a node process for the host and one for the adapter.

import { realpathSync, watch } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../../../src/lib/server/core/channels.ts';
import { words } from '../../../../../src/lib/server/core/words.ts';
import { runDeclared } from '../../../../../src/lib/server/machine/apps/shell/commands.ts';
import { readLaunch } from '../../../../../src/lib/server/machine/debug/launch/read.ts';
import { DebugClient } from '../../../../../src/lib/server/machine/debug/session.ts';
import {
    debugControl,
    startSession,
    type StartDeps
} from '../../../../../src/lib/server/machine/debug/session/start.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import {
    debugApp,
    EVERY_CAP,
    requestsTo,
    waiter,
    type AdapterCaps,
    type DescriptorKind,
    type DebugAppOver
} from '../world/debug-app.ts';
import { world, type World } from '../world/hosts-world.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);
const NOTES = 'app:notes';

/** A port nothing listens on now. */
function freePort(): Promise<number> {
    return new Promise((resolve) => {
        const probe = createServer();
        probe.listen(0, '127.0.0.1', () => {
            const { port } = probe.address() as { port: number };
            probe.close(() => resolve(port));
        });
    });
}

const LAUNCH =
    'configurations:\n  - { name: run, type: notes.dbg, request: launch, program: "${file}", stopOnEntry: true }\n  - { name: attach, type: notes.dbg, request: attach, processId: 4242 }\n  - { name: old, type: rite, program: p.rite }\n  - { name: gone, type: gone.dbg, program: x }\n  - { name: fixed, type: notes.dbg, request: launch, stopOnEntry: true }\n';

/** The statements of the host that register `notes.do`, whose operations reach the debug API. */
const COMMANDS = `
  const folder = () => oculus.workspace.workspaceFolders[0];
  const events = [];
  const waiters = [];
  const record = (text) => {
    events.push(text);
    for (const check of [...waiters]) check();
  };
  const ops = {
    start: () => oculus.debug.startDebugging(folder(), 'fixed'),
    custom: async () => (await oculus.debug.activeDebugSession.customRequest('evaluate', { expression: 'x' })).result,
    active: async () => oculus.debug.activeDebugSession === undefined ? null : oculus.debug.activeDebugSession.type,
    ended: () => new Promise((resolve) => {
      const check = () => {
        if (!events.includes('end:notes.dbg')) return;
        waiters.splice(waiters.indexOf(check), 1);
        resolve(events);
      };
      waiters.push(check);
      check();
    })
  };
  oculus.debug.onDidStartDebugSession((s) => record('start:' + s.type));
  oculus.debug.onDidTerminateDebugSession((s) => record('end:' + s.type));
  oculus.commands.registerCommand('notes.do', async (op) => ({ value: await ops[op]() }));
`;

const KEYS = '  commands:\n    - command: notes.do\n      title: Do\n';

type Setup = {
    w: World;
    client: DebugClient;
    deps: StartDeps;
    root: string;
    log: string;
    file: string;
    call: (op: string) => Promise<unknown>;
    start: (name: string | null) => ReturnType<typeof startSession>;
    until: (accepts: () => boolean) => Promise<void>;
    close: () => Promise<void>;
};

/** A world with the app `notes` and a debug client over its debuggers. */
function setup(
    kind: DescriptorKind,
    caps: AdapterCaps,
    over: DebugAppOver & { launch?: string; port?: number } = {}
): Setup {
    const dir = scratchDir('oculus-dbg-');
    const log = join(dir, 'adapter.log');
    const spec = debugApp(kind, caps, log, over.port ?? 0, {
        ...over,
        contributes: `${KEYS}${over.contributes ?? ''}`,
        extra: `${COMMANDS}${over.extra ?? ''}`
    });
    const w = world(
        { notes: spec },
        {},
        {
            real: true,
            roots: {
                r: {
                    'a.note': 'hello\n',
                    'p.rite': '(print 1)\n',
                    '.oculus/launch.yml': over.launch ?? LAUNCH
                }
            }
        }
    );
    const root = realpathSync(w.fixture.roots[0].dir);
    // The state the client publishes and the log the adapter writes are what a case waits on.
    const hub = new Hub();
    const { wake, until } = waiter();
    hub.subscribe(
        {
            send: () => {
                wake();
                return Promise.resolve();
            },
            close: () => undefined
        },
        ['debug']
    );
    const watcher = watch(dir, wake);
    const client = new DebugClient({
        hub,
        spawn: () => {
            throw new Error('no child');
        },
        adapter: () => 'rite_dap',
        catalog: () => catalog,
        killAfterMs: 500
    });
    client.attachApps(w.hosts.tools.debugPort());
    const deps: StartDeps = {
        rootsFor: () => [root],
        approvalsFor: () => join(dir, 'approvals.json'),
        catalog: () => catalog,
        client,
        port: () => client.port()
    };
    w.hosts.tools.attachDebug(debugControl(deps));
    const file = join(root, 'a.note');
    return {
        w,
        client,
        deps,
        root,
        log,
        file,
        until,
        call: async (op) => {
            const done = await runDeclared(w.hosts.shell, NOTES, 'notes.do', [op]);
            return done.ok ? (done.value as { value: unknown }).value : done.word;
        },
        start: (name) =>
            startSession(
                {
                    repo: root,
                    name,
                    context: { file },
                    breakpoints: [],
                    functions: [],
                    watch: []
                },
                deps
            ),
        async close() {
            watcher.close();
            client.close();
            await w.hosts.close();
        }
    };
}

/** The launch or attach request the adapter was sent, with its arguments. */
const begun = (log: string) =>
    requestsTo(log).find((one) => one.command === 'launch' || one.command === 'attach');

describe('a session of a debugger an app declares', () => {
    it.each(['executable', 'manifest', 'inline', 'server'] as DescriptorKind[])(
        'starts through a %s descriptor with no approval, launches with the file filled in, stops at entry and fills the call stack and the variables',
        async (kind) => {
            const s = setup(
                kind,
                { supportsConfigurationDoneRequest: true },
                { port: await freePort() }
            );
            const started = await s.start('run');
            await s.until(() => s.client.state().status === 'paused');
            const state = s.client.state();
            const sent = begun(s.log);
            await s.close();
            expect([
                started,
                sent?.command,
                sent?.arguments.program,
                sent?.arguments.stopOnEntry,
                sent?.arguments.type,
                state.frames.map((one) => one.name),
                state.scopes.map((one) => one.variables.map((v) => `${v.name}=${v.value}`)),
                state.adapter
            ]).toEqual([
                { ok: true },
                'launch',
                s.file,
                true,
                'notes.dbg',
                ['main'],
                [['x=1']],
                { type: 'notes.dbg', label: 'Notes Debug', app: NOTES }
            ]);
        },
        60000
    );

    it('starts the program the manifest names for an app with no host file, with no approval question', async () => {
        const s = setup('manifest', { supportsConfigurationDoneRequest: true }, { hostless: true });
        const started = await s.start('run');
        await s.until(() => s.client.state().status === 'paused');
        const sent = begun(s.log);
        await s.close();
        expect([started, sent?.command, sent?.arguments.program]).toEqual([
            { ok: true },
            'launch',
            s.file
        ]);
    }, 60000);

    it.each(['executable', 'server'] as DescriptorKind[])(
        'ends the session and the adapter when the host is killed while a %s descriptor session is paused',
        async (kind) => {
            const s = setup(
                kind,
                { supportsConfigurationDoneRequest: true },
                { port: await freePort() }
            );
            await s.start('run');
            await s.until(() => s.client.state().status === 'paused');
            const host = s.w.hosts.rows().find((one) => one.app === NOTES)?.pid ?? 0;
            process.kill(host, 'SIGKILL');
            await s.w.ended(NOTES);
            await s.until(() => s.client.state().status === 'ended');
            const state = s.client.state();
            await s.close();
            expect([host > 0, state.status, state.ended === '']).toEqual([true, 'ended', false]);
        },
        60000
    );

    it('sends attach for an attach entry, with its own keys', async () => {
        const s = setup('executable', { supportsConfigurationDoneRequest: true });
        await s.start('attach');
        await s.until(() => s.client.state().status === 'running' && begun(s.log) !== undefined);
        const sent = begun(s.log);
        await s.close();
        expect([sent?.command, sent?.arguments.processId, sent?.arguments.name]).toEqual([
            'attach',
            4242,
            'attach'
        ]);
    }, 60000);

    it('asks which end it is when stopped, and ends an adapter that declared terminate with terminate', async () => {
        const s = setup('executable', {
            supportsConfigurationDoneRequest: true,
            supportsTerminateRequest: true
        });
        await s.start('run');
        await s.until(() => s.client.state().status === 'paused');
        const asked = s.client.stop(false);
        const stopped = s.client.stop(true);
        await s.until(() => s.client.state().status !== 'paused');
        const commands = requestsTo(s.log).map((one) => one.command);
        await s.close();
        expect([
            'confirm' in asked ? asked.confirm : asked,
            stopped,
            commands.find((one) => one === 'terminate' || one === 'disconnect')
        ]).toEqual([
            words(catalog, 'server.debug.process_app', 'Notes Debug', 'run'),
            { ok: true },
            'terminate'
        ]);
    }, 60000);

    it('ends an adapter that declared no terminate with disconnect that ends the program', async () => {
        const s = setup('executable', { supportsConfigurationDoneRequest: true });
        await s.start('run');
        await s.until(() => s.client.state().status === 'paused');
        s.client.stop(true);
        await s.until(() => requestsTo(s.log).some((one) => one.command === 'disconnect'));
        const sent = requestsTo(s.log).find((one) => one.command === 'disconnect');
        await s.close();
        expect(sent?.arguments).toEqual({ terminateDebuggee: true });
    }, 60000);

    it('refuses a second session while one runs, and a type no app declares', async () => {
        const s = setup('executable', { supportsConfigurationDoneRequest: true });
        await s.start('run');
        await s.until(() => s.client.state().status === 'paused');
        const second = await s.start('run');
        const unknown = await s.start('gone');
        await s.close();
        expect([second, unknown]).toEqual([
            { error: words(catalog, 'server.debug.running') },
            { error: words(catalog, 'server.debug.no_configuration', 'gone') }
        ]);
    }, 60000);
});

describe('what an adapter declares', () => {
    const NONE: AdapterCaps = { supportsConfigurationDoneRequest: true };
    const ALL = EVERY_CAP;

    /** A session started with one breakpoint that carries a condition, a hit count and a log. */
    async function session(caps: AdapterCaps) {
        const s = setup('executable', caps);
        await startSession(
            {
                repo: s.root,
                name: 'run',
                context: { file: s.file },
                breakpoints: [
                    {
                        path: s.file,
                        lines: [
                            {
                                line: 1,
                                condition: 'x > 1',
                                hitCondition: '3',
                                logMessage: 'hit {x}'
                            }
                        ]
                    }
                ],
                functions: [{ name: 'main', condition: 'x' }],
                watch: []
            },
            s.deps
        );
        await s.until(() => s.client.state().status === 'paused');
        return s;
    }

    it('offers no control and sends no extra request when it declared nothing', async () => {
        const s = await session(NONE);
        const completions = await s.client.controls.completions('x', 1);
        await s.client.resume('continue');
        const refusals = [await s.client.controls.restart(), completions];
        const declared = s.client.state().declared['notes.dbg'];
        const breakpoint = requestsTo(s.log)
            .filter((one) => one.command === 'setBreakpoints')
            .at(-1)?.arguments.breakpoints;
        const commands = requestsTo(s.log).map((one) => one.command);
        await s.close();
        const refused = { error: words(catalog, 'server.debug.not_declared') };
        expect([
            refusals,
            Object.values(declared).every(
                (one) => one === false || (Array.isArray(one) && one.length === 0)
            ),
            breakpoint,
            commands.includes('setFunctionBreakpoints')
        ]).toEqual([[refused, refused], true, [{ line: 1 }], false]);
    }, 60000);

    it('pauses a running thread of an adapter that declared nothing', async () => {
        const s = await session(NONE);
        await s.client.resume('continue');
        const running = s.client.state().status;
        const paused = await s.client.controls.pause();
        const sent = requestsTo(s.log).filter((one) => one.command === 'pause');
        await s.close();
        expect([running, paused, sent.map((one) => one.arguments)]).toEqual([
            'running',
            { ok: true },
            [{ threadId: 1 }]
        ]);
    }, 60000);

    it('pauses the first thread the adapter lists when the program has not stopped yet', async () => {
        const s = setup('executable', { supportsConfigurationDoneRequest: true, oculusThread: 7 });
        await s.start('attach');
        await s.until(() => s.client.state().status === 'running' && begun(s.log) !== undefined);
        const paused = await s.client.controls.pause();
        await s.until(() => s.client.state().status === 'paused');
        const sent = requestsTo(s.log)
            .filter((one) => one.command === 'pause')
            .map((one) => one.arguments);
        await s.close();
        expect([paused, sent]).toEqual([{ ok: true }, [{ threadId: 7 }]]);
    }, 60000);

    it('draws each control and sends each request when it declared them', async () => {
        const s = await session(ALL);
        const completions = await s.client.controls.completions('x', 1);
        await s.client.resume('continue');
        const paused = await s.client.controls.pause();
        const restarted = await s.client.controls.restart();
        const declared = s.client.state().declared['notes.dbg'];
        const exceptions = s.client.state().exceptions.map((one) => [one.filter, one.enabled]);
        const requests = requestsTo(s.log);
        const breakpoint = requests.filter((one) => one.command === 'setBreakpoints').at(-1)
            ?.arguments.breakpoints;
        const functions = requests.filter((one) => one.command === 'setFunctionBreakpoints').at(-1)
            ?.arguments.breakpoints;
        await s.close();
        expect([
            declared.conditions,
            declared.hitConditions,
            declared.logpoints,
            declared.functions,
            declared.hover,
            declared.setVariable,
            declared.restart,
            declared.completions,
            exceptions,
            breakpoint,
            functions,
            paused,
            restarted,
            'items' in completions,
            requests
                .map((one) => one.command)
                .filter((one) => ['pause', 'restart', 'completions'].includes(one))
        ]).toEqual([
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            [['all', true]],
            [{ line: 1, condition: 'x > 1', hitCondition: '3', logMessage: 'hit {x}' }],
            [{ name: 'main', condition: 'x' }],
            { ok: true },
            { ok: true },
            true,
            ['completions', 'pause', 'restart']
        ]);
    }, 60000);
});

describe('the launch file', () => {
    it('reads an entry with no type as the oculus adapter and leaves out the type no app declares, with its finding', async () => {
        const s = setup('executable', { supportsConfigurationDoneRequest: true });
        await s.call('active');
        const read = readLaunch(
            s.root,
            s.client.debuggers().map((one) => one.debugger)
        );
        const names = read.configurations.map((one) => [one.name, one.type]);
        const findings = read.findings.map((one) => [one.field, one.message]);
        const approval = await s.start('old');
        await s.close();
        expect([names, findings, approval]).toEqual([
            [
                ['run', 'notes.dbg'],
                ['attach', 'notes.dbg'],
                ['old', 'rite'],
                ['fixed', 'notes.dbg']
            ],
            [
                [
                    'configurations[3].type',
                    'names gone.dbg, which no app that acts declares as a debugger, so the entry is left out'
                ]
            ],
            { approve: { name: 'old', cwd: '.', program: 'p.rite' } }
        ]);
    }, 60000);
});

describe('the configuration providers of a type', () => {
    const PROVIDER = `  oculus.debug.registerDebugConfigurationProvider('notes.dbg', {
    provideDebugConfigurations: () => [{ name: 'Provided', type: 'notes.dbg', request: 'launch' }],
    resolveDebugConfiguration: (folder, config) => config.name === 'run' ? { ...config, resolved: 1 } : undefined,
    resolveDebugConfigurationWithSubstitutedVariables: (folder, config) => ({ ...config, program: config.program + '!' })
  });
`;

    it('resolves a configuration before and after its placeholders are filled, and aborts the launch of one a provider answers nothing for', async () => {
        const s = setup(
            'executable',
            { supportsConfigurationDoneRequest: true },
            {
                extra: PROVIDER,
                launch: `${LAUNCH}  - { name: other, type: notes.dbg, program: x }\n`
            }
        );
        await s.call('active');
        const started = await s.start('run');
        await s.until(() => begun(s.log) !== undefined);
        const sent = begun(s.log)?.arguments;
        s.client.stop(true);
        await s.until(
            () => s.client.state().status !== 'paused' && s.client.state().status !== 'running'
        );
        const aborted = await s.start('other');
        await s.close();
        expect([started, sent?.resolved, sent?.program, aborted]).toEqual([
            { ok: true },
            1,
            `${s.file}!`,
            { error: words(catalog, 'server.debug.aborted') }
        ]);
    }, 60000);

    it('lists what provideDebugConfigurations answers for Add Configuration', async () => {
        const s = setup(
            'executable',
            { supportsConfigurationDoneRequest: true },
            { extra: PROVIDER }
        );
        await s.call('active');
        const port = s.client.port();
        const listed = await port?.configurations('notes.dbg', '');
        await s.close();
        expect(listed).toEqual([{ name: 'Provided', type: 'notes.dbg', request: 'launch' }]);
    }, 60000);
});

describe('the host of the debugger', () => {
    it('starts a session with startDebugging, is refused a second while one runs, reaches it with customRequest and hears it start and end', async () => {
        const s = setup('executable', { supportsConfigurationDoneRequest: true });
        const first = await s.call('start');
        await s.until(() => s.client.state().status === 'paused');
        const second = await s.call('start');
        const custom = await s.call('custom');
        const active = await s.call('active');
        s.client.stop(true);
        await s.until(
            () => s.client.state().status === 'ended' || s.client.state().status === 'idle'
        );
        await s.until(() => requestsTo(s.log).some((one) => one.command === 'disconnect'));
        const events = await s.call('ended');
        await s.close();
        expect([first, second, custom, active, events]).toEqual([
            true,
            false,
            '42',
            'notes.dbg',
            ['start:notes.dbg', 'end:notes.dbg']
        ]);
    }, 60000);
});
