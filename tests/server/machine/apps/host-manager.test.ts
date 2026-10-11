// Layer 2, server test. When the host of a machine app runs and what it answers: the manager
// (lib/server/machine/apps/host/manager.ts) over hosts that are scripted connections in this
// process (hosts-world.ts), so no program is started. The real runner and its import guard are
// tests/server/machine/apps/host-runner.test.ts.
//
// Every folder is synthetic, under the system temporary directory, the keyring is in memory and the
// stores are maps. What this does NOT cover: the runner's own loading of a host file, the framing
// over a real pipe, and the routes that call the manager (tests/routes/apps).

import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import type {
    AppHostRow,
    AppMessagesPayload,
    AppHostsPayload
} from '../../../../src/lib/data/model/index.ts';
import { it } from '../../../fixtures/scratch.ts';
import { world, type AppSpec, type Script, type World } from './hosts-world.ts';

/** A promise settled by hand, for a case that waits on what a scripted host was asked. */
function deferred() {
    let done: () => void = () => undefined;
    const promise = new Promise<void>((resolve) => {
        done = resolve;
    });
    return { promise, done };
}

const NOTES = 'app:notes';
const BASE = 'app:base';

/** Wait for a row of the Processes view to be as the case needs. */
const rowOf = (w: World, id: string): AppHostRow | undefined =>
    w.hosts.rows().find((one) => one.app === id);

/** One host that has started: the world after a tab was drawn. */
async function started(
    specs: Record<string, AppSpec>,
    scripts: Record<string, Script> = {},
    over: Parameters<typeof world>[2] = {}
): Promise<World> {
    const w = world(specs, scripts, over);
    await w.hosts.tab(NOTES);
    return w;
}

type Row = [string, () => unknown, unknown];

const STARTS: Row[] = [
    [
        'an approved, enabled app with a tab drawn: one process, an argument array, the app folder',
        async () => {
            const w = await started({ notes: {} }, {}, { prefix: 'oculus host $(x) ' });
            await w.hosts.tab(NOTES);
            const [one] = w.spawned;
            const app = w.held().apps[0].row;
            return {
                spawns: w.spawned.length,
                program: one.command === process.execPath,
                count: one.args.length,
                runner: one.args[0].endsWith('host-runner.mjs'),
                hostFile: one.args[1] === `${app.folder}/host.mjs`,
                hostFileHoldsSpace: one.args[1].includes(' ') && one.args[1].includes('$(x)'),
                cwd: one.cwd === app.folder,
                electron: one.env.ELECTRON_RUN_AS_NODE,
                inherited: one.env.PATH === process.env.PATH
            };
        },
        {
            spawns: 1,
            program: true,
            count: 3,
            runner: true,
            hostFile: true,
            hostFileHoldsSpace: true,
            cwd: true,
            electron: '1',
            inherited: true
        }
    ],
    [
        'an unapproved app, which no tab starts',
        async () => {
            const w = world({ notes: {} }, {}, { approve: [] });
            await w.hosts.tab(NOTES);
            return [w.spawned.length, rowOf(w, NOTES)];
        },
        [0, undefined]
    ],
    [
        'a disabled app, which no tab starts',
        async () => {
            const w = world({ notes: {} });
            w.disable(NOTES);
            await w.hosts.tab(NOTES);
            return w.spawned.length;
        },
        0
    ],
    [
        'a kept app whose files differ from the approved hash, which waits for an approval',
        async () => {
            const w = world({ notes: {} });
            w.keep('notes');
            w.edit('notes', 'host.mjs', 'export function activate() { /* changed */ }\n');
            await w.hosts.tab(NOTES);
            const row = rowOf(w, NOTES);
            return [w.spawned.length, row?.state, row?.waiting];
        },
        [0, 'waiting', 'approval']
    ],
    [
        'an app that names no host, which has nothing to start',
        async () => {
            const w = world({ notes: { host: null } });
            await w.hosts.tab(NOTES);
            return [w.spawned.length, w.hosts.rows()];
        },
        [0, []]
    ]
];

describe('starts the host of an app only while it may run, once, as a program with an argument array', () => {
    it.each(STARTS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});

/** Make the app's host stop for the reason of the row. */
const STOPS: [string, (w: World) => void][] = [
    ['the app is disabled', (w) => void w.disable(NOTES)],
    [
        'the workspace changes to one that disables it',
        (w) => {
            writeFileSync(
                join(w.fixture.base, 'apps.json'),
                JSON.stringify({
                    version: 1,
                    disabled: [],
                    workspaces: { lab: { disabled: [NOTES], enabled: [] } }
                })
            );
            w.switchWorkspace('lab');
        }
    ],
    ['the approval is revoked', (w) => void w.rescan([])],
    [
        'its files change',
        (w) => void w.edit('notes', 'host.mjs', 'export function activate() { /* changed */ }\n')
    ],
    [
        'the app is removed',
        (w) => {
            rmSync(join(w.fixture.machine, 'notes'), { recursive: true });
            w.rescan();
        }
    ]
];

describe('stops the host when its app is disabled, revoked, changed or removed, the workspace changes, and at close', () => {
    it.each(STOPS)(
        'when %s: deactivate is called once, then the process ends',
        async (_why, act) => {
            const w = await started({ notes: {} });
            const [one] = w.spawned;
            act(w);
            await w.hosts.settled();
            expect([one.deactivations, one.ended, one.signals]).toEqual([1, true, []]);
            expect(rowOf(w, NOTES)?.state).not.toBe('running');
        }
    );

    it('ends every host at close, dependents first', async () => {
        const w = world({ notes: { keys: 'depends: [base]\n' }, base: {} });
        await w.hosts.tab(NOTES);
        expect(w.spawned.map((one) => one.name)).toEqual(['base', 'notes']);
        const order: string[] = [];
        await w.hosts.close();
        for (const one of w.spawned) order.push(`${one.name}:${one.ended}:${one.deactivations}`);
        expect(order).toEqual(['base:true:1', 'notes:true:1']);
    });

    it('starts no host before its server listens, then starts the hosts its apps ask for', async () => {
        const seen: string[] = [];
        const started = deferred();
        const listening = deferred();
        const w = world(
            { notes: { keys: 'activation: [onStartupFinished]\n' } },
            {
                notes: {
                    activate: () => {
                        seen.push('host started');
                        started.done();
                    }
                }
            },
            { options: { after: listening.promise } }
        );
        w.hosts.reconcile();
        await w.hosts.settled();
        const early = [...seen];
        seen.push('server listens');
        listening.done();
        await started.promise;
        expect({ early, seen }).toEqual({ early: [], seen: ['server listens', 'host started'] });
    });

    it('sends SIGTERM when deactivate does not settle in apps.host_stop_seconds, then SIGKILL 2 s later', async () => {
        const reached = deferred();
        const w = await started(
            { notes: {} },
            {
                notes: {
                    deactivate: () => {
                        reached.done();
                        return new Promise(() => undefined);
                    },
                    survive: true
                }
            },
            { settings: { hostStopSeconds: 1 } }
        );
        const [one] = w.spawned;
        void w.hosts.stop(NOTES);
        await reached.promise;
        w.clock.advance(999);
        const early = [...one.signals];
        w.clock.advance(1);
        const term = [...one.signals];
        w.clock.advance(1999);
        const beforeKill = [...one.signals];
        w.clock.advance(1);
        await w.hosts.settled();
        expect([early, term, beforeKill, one.signals, one.ended]).toEqual([
            [],
            ['SIGTERM'],
            ['SIGTERM'],
            ['SIGTERM', 'SIGKILL'],
            true
        ]);
    });
});

describe('does not start again a host that ended by itself, and starts it once on Restart', () => {
    it('shows the exit code in the row and its output, offers Restart and starts one process', async () => {
        const w = await started({ notes: {} });
        w.spawned[0].end(3);
        await w.hosts.tab(NOTES);
        const ended = rowOf(w, NOTES);
        const said = w.hosts.output(NOTES);
        const spawnedAfterTab = w.spawned.length;
        const restarted = await w.hosts.restart(NOTES);
        expect({
            spawnedAfterTab,
            state: ended?.state,
            code: ended?.code,
            said: said.some((line) => line.includes('3')),
            restarted,
            spawns: w.spawned.length,
            now: rowOf(w, NOTES)?.state
        }).toEqual({
            spawnedAfterTab: 1,
            state: 'ended',
            code: 3,
            said: true,
            restarted: true,
            spawns: 2,
            now: 'running'
        });
    });
});

const answered = (promise: Promise<unknown>): Promise<unknown> =>
    promise.then(
        (value) => value,
        (error: unknown) => (error instanceof Error ? `rejected:${error.message}` : error)
    );

describe('answers a request of a tab from the host, and a refusal as its word', () => {
    it('hands the handler the method, the params and that tab, and the frame its answer', async () => {
        const w = world(
            { notes: {} },
            {
                notes: {
                    request: ({ method, params, tab }) =>
                        method === 'boom'
                            ? Promise.reject(new Error('nope'))
                            : { method, params, tab }
                }
            }
        );
        const ping = await w.hosts.request(NOTES, 'ping', { n: 1 }, 'tab-7');
        const boom = await w.hosts.request(NOTES, 'boom', null, 'tab-7');
        expect({ ping, boom, handled: w.spawned[0].requests }).toEqual({
            ping: { ok: true, value: { method: 'ping', params: { n: 1 }, tab: 'tab-7' } },
            boom: { ok: false, word: 'refused:nope' },
            handled: [
                { method: 'ping', params: { n: 1 }, tab: 'tab-7' },
                { method: 'boom', params: null, tab: 'tab-7' }
            ]
        });
    });

    it('answers not_declared for an app with no host, and host_down for a host that cannot start', async () => {
        const none = world({ notes: { host: null } });
        const unapproved = world({ notes: {} }, {}, { approve: [] });
        expect([
            await none.hosts.request(NOTES, 'ping', null, 't'),
            await unapproved.hosts.request(NOTES, 'ping', null, 't')
        ]).toEqual([
            { ok: false, word: 'not_declared' },
            { ok: false, word: 'host_down' }
        ]);
    });

    it('answers host_down for a request in flight when the host is stopped', async () => {
        const reached = deferred();
        const w = world(
            { notes: {} },
            {
                notes: {
                    request: () => {
                        reached.done();
                        return new Promise(() => undefined);
                    }
                }
            }
        );
        const asked = w.hosts.request(NOTES, 'slow', null, 't');
        await reached.promise;
        await w.hosts.stop(NOTES);
        expect(await asked).toEqual({ ok: false, word: 'host_down' });
    });
});

/** What the app-messages channel carried, flattened. */
const messages = (w: World) =>
    w.carried('app-messages').flatMap((one) => (one.payload as AppMessagesPayload).messages);

describe('sends what the host says to the page on app-messages, to one tab or to every tab of the app', () => {
    it('carries the tab when one is named and an empty tab otherwise', async () => {
        const w = await started({ notes: {} });
        const host = w.spawned[0].connection;
        await host.sendRequest('oculus/sendToPage', { method: 'm', params: 1, tab: 'tab-2' });
        await host.sendRequest('oculus/sendToPage', { method: 'm', params: 1 });
        expect(messages(w)).toEqual([
            { app: NOTES, tab: 'tab-2', method: 'm', params: 1 },
            { app: NOTES, tab: '', method: 'm', params: 1 }
        ]);
    });

    it.each([
        ['the 601st call of a minute', 600, 601],
        ['the 11th call with apps.messages_per_min 10', 10, 11]
    ])('drops %s and rejects it with rate', async (_row, limit, calls) => {
        const w = await started({ notes: {} }, {}, { settings: { messagesPerMin: limit } });
        const host = w.spawned[0].connection;
        const outcomes: unknown[] = [];
        for (let call = 1; call <= calls; call += 1) {
            outcomes.push(
                await answered(host.sendRequest('oculus/sendToPage', { method: 'm', params: call }))
            );
        }
        expect({
            last: outcomes.at(-1),
            before: outcomes.slice(0, -1).every((one) => one === null),
            carried: messages(w).length
        }).toEqual({
            last: 'rejected:rate',
            before: true,
            carried: limit
        });
    });
});

describe('keeps the store of the app by key for its host, and tells it what a frame changed', () => {
    it('reads back an update, lists keys, deletes with undefined and counts 30 updates a minute', async () => {
        const w = await started({ notes: {} });
        const host = w.spawned[0].connection;
        await host.sendRequest('oculus/store/update', { key: 'a', value: 1 });
        const got = await host.sendRequest('oculus/store/get', { key: 'a' });
        const missing = await host.sendRequest('oculus/store/get', { key: 'zz' });
        const keys = await host.sendRequest('oculus/store/keys');
        await host.sendRequest('oculus/store/update', { key: 'a' });
        const after = await host.sendRequest('oculus/store/keys');
        expect({ got, missing, keys, after }).toEqual({
            got: { has: true, value: 1 },
            missing: { has: false },
            keys: ['a'],
            after: []
        });
    });

    it('rejects the 31st update of a minute with rate', async () => {
        const w = await started({ notes: {} });
        const host = w.spawned[0].connection;
        const outcomes: unknown[] = [];
        for (let call = 1; call <= 31; call += 1) {
            outcomes.push(
                await answered(host.sendRequest('oculus/store/update', { key: 'k', value: call }))
            );
        }
        expect([outcomes.slice(0, 30).every((one) => one === null), outcomes[30]]).toEqual([
            true,
            'rejected:rate'
        ]);
    });

    it("calls the host's onDidChange with the keys a frame changed, and not for its own update", async () => {
        const told = deferred();
        const w = await started({ notes: {} }, { notes: { storeChanged: () => told.done() } });
        const host = w.spawned[0];
        await host.connection.sendRequest('oculus/store/update', { key: 'a', value: 1 });
        const own = host.notified.length;
        w.stores.set(NOTES, { a: 1, b: 2 });
        w.hosts.storeChanged([NOTES]);
        await told.promise;
        expect([own, host.notified]).toEqual([0, [{ keys: ['b'] }]]);
    });
});

describe('starts the dependencies of a host first and lets it call their API', () => {
    const scripts: Record<string, Script> = {
        base: {
            apiCall: ({ fn, args }) =>
                fn === 'add' ? (args as number[]).reduce((a, b) => a + b, 0) : ['add']
        }
    };

    it('starts base before notes, lists base API and reaches its function with JSON arguments', async () => {
        const w = world({ notes: { keys: 'depends: [base]\n' }, base: {} }, scripts);
        await w.hosts.tab(NOTES);
        const host = w.spawned.find((one) => one.name === 'notes')?.connection;
        const names = await host?.sendRequest('oculus/apps/get', { name: 'base' });
        const sum = await host?.sendRequest('oculus/apps/call', {
            name: 'base',
            fn: 'add',
            args: [1, 2]
        });
        const other = await answered(
            host?.sendRequest('oculus/apps/get', { name: 'other' }) ?? Promise.resolve()
        );
        expect({ order: w.spawned.map((one) => one.name), names, sum, other }).toEqual({
            order: ['base', 'notes'],
            names: ['add'],
            sum: 3,
            other: 'rejected:not_declared'
        });
    });

    it('starts neither host of two that depend on each other, and both rows say why', async () => {
        const w = world({ a: { keys: 'depends: [b]\n' }, b: { keys: 'depends: [a]\n' } });
        await w.hosts.tab('app:a');
        await w.hosts.tab('app:b');
        expect([
            w.spawned.length,
            w.hosts.rows().map((one) => [one.app, one.state, one.waiting])
        ]).toEqual([
            0,
            [
                ['app:a', 'waiting', 'cycle'],
                ['app:b', 'waiting', 'cycle']
            ]
        ]);
    });

    it('leaves an app offered with its host waiting, the row naming a dependency that is not approved', async () => {
        const w = world({ notes: { keys: 'depends: [base]\n' }, base: {} }, scripts, {
            approve: ['notes']
        });
        await w.hosts.tab(NOTES);
        const row = rowOf(w, NOTES);
        expect([w.spawned.length, row?.state, row?.waiting, row?.dependency]).toEqual([
            0,
            'waiting',
            'dependency',
            'base'
        ]);
    });

    it('says a dependency that no app provides is missing, and one that is refused, disabled or unapproved is not', async () => {
        const waits = async (specs: Record<string, AppSpec>, setup: (w: World) => void) => {
            const w = world(specs, scripts, { approve: ['notes'] });
            setup(w);
            await w.hosts.tab(NOTES);
            const row = rowOf(w, NOTES);
            return [row?.waiting, row?.dependency];
        };
        const none = (): void => undefined;
        const refused = { keys: 'bridge: 1\n' };
        expect({
            absent: await waits({ notes: { keys: 'depends: [nonesuch]\n' } }, none),
            unapproved: await waits({ notes: { keys: 'depends: [base]\n' }, base: {} }, none),
            disabled: await waits({ notes: { keys: 'depends: [base]\n' }, base: {} }, (w) =>
                w.disable('app:base')
            ),
            refused: await waits({ notes: { keys: 'depends: [base]\n' }, base: refused }, none)
        }).toEqual({
            absent: ['missing', 'nonesuch'],
            unapproved: ['dependency', 'base'],
            disabled: ['dependency', 'base'],
            refused: ['dependency', 'base']
        });
    });

    it('stops notes when the approval of base is revoked, and its row says base stopped it', async () => {
        const w = world({ notes: { keys: 'depends: [base]\n' }, base: {} }, scripts);
        await w.hosts.tab(NOTES);
        w.rescan(['notes']);
        await w.hosts.settled();
        const row = rowOf(w, NOTES);
        expect([w.spawned.map((one) => one.ended), row?.waiting, row?.stoppedBy]).toEqual([
            [true, true],
            'dependency',
            'base'
        ]);
        expect(BASE).toBe('app:base');
    });
});

/** A root `hub` holding these files, for a host that starts on a `workspaceContains` event. */
const root = (files: Record<string, string>) => ({ hub: files });

describe('starts a host at the first of its events', () => {
    const TEX = "activation: ['workspaceContains:**/*.tex']\n";

    it('starts for a file the glob matches in a shown root, and not for one only inside node_modules or .git', async () => {
        const hit = world({ notes: { keys: TEX } }, {}, { roots: root({ 'paper/main.tex': 'x' }) });
        hit.hosts.reconcile();
        await hit.hosts.settled();
        expect(hit.spawned.length).toBe(1);
        const miss = world(
            { notes: { keys: TEX } },
            {},
            { roots: root({ 'node_modules/p/main.tex': 'x', '.git/main.tex': 'x', 'a.txt': 'x' }) }
        );
        miss.hosts.reconcile();
        await miss.hosts.settled();
        expect(miss.spawned.length).toBe(0);
    });

    it('reads at most apps.scan_entries entries of a root, so a match past them starts nothing', async () => {
        const names = [...Array.from({ length: 19 }, (_, at) => `f${at}.txt`), 'main.tex'];
        const list = (_folder: string, limit: number) =>
            Promise.resolve(names.slice(0, limit).map((name) => ({ name, kind: 'file' as const })));
        const w = world(
            { notes: { keys: TEX } },
            {},
            { roots: root({}), settings: { scanEntries: 5 }, options: { list } }
        );
        w.hosts.reconcile();
        await w.hosts.settled();
        const wide = world(
            { notes: { keys: TEX } },
            {},
            { roots: root({}), settings: { scanEntries: 20 }, options: { list } }
        );
        wide.hosts.reconcile();
        await wide.hosts.settled();
        expect(wide.spawned.length).toBe(1);
        expect(w.spawned.length).toBe(0);
    });

    it('starts for a source tab of a file of the language, and for the first drawn tab', async () => {
        const w = world(
            { notes: { keys: 'activation: [onLanguage:python]\n' } },
            {},
            { options: { languages: () => new Map([['.py', 'python']]) } }
        );
        w.hosts.opened('x.md');
        await w.hosts.settled();
        const before = w.spawned.length;
        w.hosts.opened('src/x.py');
        await w.hosts.settled();
        expect([before, w.spawned.length]).toEqual([0, 1]);
    });

    it('starts at once for onStartupFinished once the apps are read', async () => {
        const w = world({ notes: { keys: 'activation: [onStartupFinished]\n' } });
        w.hosts.reconcile();
        await w.hosts.settled();
        expect(w.spawned.length).toBe(1);
    });
});

describe('keeps the output of a host and publishes the rows on app-hosts', () => {
    it('keeps at most apps.host_output_kb of the last lines', async () => {
        const w = await started({ notes: {} }, {}, { settings: { hostOutputKb: 1 } });
        const lines = Array.from(
            { length: 40 },
            (_, at) => `${String(at).padStart(3, '0')} ${'x'.repeat(96)}`
        );
        for (const line of lines) w.spawned[0].stderr.write(`${line}\n`);
        const kept = w.hosts.output(NOTES);
        expect([kept.join('\n').length <= 1024, kept.at(-1), kept.length > 0]).toEqual([
            true,
            lines.at(-1),
            true
        ]);
    });

    it('publishes a row for the running host that the Processes view draws', async () => {
        const w = await started({ notes: {} });
        const last = w.carried('app-hosts').at(-1)?.payload as AppHostsPayload;
        expect(last.rows.map((one) => [one.app, one.state, one.pid > 0])).toEqual([
            [NOTES, 'running', true]
        ]);
        expect(last.rows).toEqual(w.hosts.rows());
    });
});
