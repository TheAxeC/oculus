// Layer 2, server tests. The server context follows the open workspace (G61, G69): a switch to a
// second workspace file and a hand edit of the open file are each followed by the roots, the
// portfolio, the git watch, the language-server relay, the open-files poll, the app hosts and the
// watch on the hubs' local.yml, and the recent list has the second file first. A second primary
// that sets another port leaves the port in force as it was and gives the Findings view a finding
// naming the key and the restart. Between changes the context serves the open workspace and the
// machine's values as it holds them and reads no disk. The workspace's poll runs on a clock the
// case ticks itself, every watcher that the case does not look at is inert, and every folder is a
// scratch folder under the system temporary directory.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import { loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { sourceChannel } from '../../../src/lib/data/helpers/files/address.ts';
import type { Sink } from '../../../src/lib/server/core/channels.ts';
import { repositoryRoots } from '../../../src/lib/server/files/roots.ts';
import {
    createServerContext,
    type ContextDependencies,
    type ServerContext
} from '../../../src/lib/server/root/context.ts';
import { startHosts } from '../../../src/lib/server/root/process/apps-hosts.ts';
import { createWorkspace } from '../../../src/lib/server/files/workspace/follow.ts';
import { selectWorkspace } from '../../../src/lib/server/files/workspace/actions.ts';
import { readState, writeState } from '../../../src/lib/server/files/workspace/state.ts';
import { manualClock } from '../../fixtures/doubles.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { plantHub } from '../../fixtures/hubs/workspace.ts';
import {
    inert,
    inertApps,
    inertDependencies,
    scratchEngine,
    scratchReadMachine
} from './inert-context.ts';

let live: ServerContext | undefined;

afterEach(() => {
    live?.close();
    live = undefined;
    vi.restoreAllMocks();
});

/** What the watchers the case looks at were handed. */
type Seen = {
    portfolioOpen: () => { folders: { name: string }[] };
    portfolioHeard: number;
    gitRoots: () => string[];
    gitHeard: number;
    relayRoots: () => { key: string }[];
    relayCalls: Record<string, number>;
    watchedLocal: string[][];
    localChanged: () => void;
    portfolioHeld: () => { file: string; key?: string; message: string }[];
    appsHeard: number;
    hostsHeard: number;
    hostsOpen: () => { roots: { key: string }[] };
};

/** Two workspace files over two hubs, the state naming the first, and a context started on it. */
function started() {
    const root = scratchDir('oculus-workspace-follow-');
    const folder = (name: string): string => {
        const dir = join(root, name);
        mkdirSync(dir, { recursive: true });
        return dir;
    };
    const research = plantHub(folder('research-hub'));
    const lab = plantHub(folder('lab'));
    const claude = folder('claude');
    const notes = folder('notes');
    writeFileSync(join(lab, 'a.md'), 'lab\n');
    writeFileSync(join(research, '.oculus', 'local.yml'), 'port: 8800\n');
    writeFileSync(join(lab, '.oculus', 'local.yml'), 'port: 8801\n');
    const files = join(research, '.oculus', 'workspaces');
    mkdirSync(files, { recursive: true });
    const one = join(files, 'one.yml');
    const two = join(files, 'two.yml');
    writeFileSync(
        one,
        `folders:\n  - { name: research-hub, path: ${research} }\n  - { name: notes, path: ${notes} }\nprimary: research-hub\n`
    );
    writeFileSync(
        two,
        `folders:\n  - { name: lab, path: ${lab} }\n  - { name: claude, path: ${claude} }\nprimary: lab\n`
    );
    const state = folder('state');
    writeState(state, { open: one, recent: [one], unsaved: { folders: [] } });

    const clock = manualClock();
    const engine = scratchEngine('oculus-workspace-follow-engine-');
    const seen = {
        portfolioHeard: 0,
        gitHeard: 0,
        appsHeard: 0,
        hostsHeard: 0,
        relayCalls: {},
        watchedLocal: [] as string[][]
    } as Seen;
    const replacements: Partial<ContextDependencies> = {
        ...inertDependencies(),
        stateFolder: () => state,
        readMachine: scratchReadMachine(engine),
        createWorkspace: (dir) => createWorkspace(dir, clock, 1),
        watchPortfolio: (
            _hub: unknown,
            paths: Parameters<ContextDependencies['watchPortfolio']>[1]
        ) => {
            seen.portfolioOpen = paths.open;
            seen.portfolioHeld = paths.held ?? (() => []);
            paths.follow?.(() => (seen.portfolioHeard += 1));
            return inert();
        },
        watchGit: (_hub: unknown, options: Parameters<ContextDependencies['watchGit']>[1]) => {
            seen.gitRoots = options.roots ?? (() => []);
            options.follow?.(() => (seen.gitHeard += 1));
            return inert();
        },
        createRelay: (options: Parameters<ContextDependencies['createRelay']>[0]) => {
            seen.relayRoots = options.roots;
            return new Proxy(
                {},
                {
                    get: (_target, name) =>
                        name === 'then'
                            ? undefined
                            : () => {
                                  seen.relayCalls[String(name)] =
                                      (seen.relayCalls[String(name)] ?? 0) + 1;
                              }
                }
            ) as never;
        },
        watchApps: (_hub: unknown, options: Parameters<ContextDependencies['watchApps']>[1]) => {
            options.follow?.(() => (seen.appsHeard += 1));
            return inertApps();
        },
        startHosts: (options: Parameters<ContextDependencies['startHosts']>[0]) => {
            seen.hostsOpen = options.open;
            return startHosts({
                ...options,
                follow: (listener) =>
                    (options.follow ?? (() => () => undefined))(() => {
                        seen.hostsHeard += 1;
                        listener();
                    })
            });
        },
        watchLocal: (hubs: string[], changed: () => void) => {
            seen.localChanged = changed;
            seen.watchedLocal.push(hubs);
            return inert();
        }
    };
    const context = createServerContext(engine, replacements);
    live = context;
    return { context, clock, seen, engine, state, one, two, research, lab, claude, notes };
}

const silent = { send: () => Promise.resolve(), close: () => undefined } as Sink;

describe('the server context after a switch to a second workspace file', () => {
    it("serves the second file's folders from every part that follows the workspace", () => {
        const world = started();
        const { context, clock, seen } = world;
        expect(context.workspace.open().roots.map((one) => one.key)).toEqual([
            'research-hub',
            'notes'
        ]);
        expect(seen.watchedLocal).toEqual([[world.research]]);
        const before = context.openFiles.subscribed(silent, [sourceChannel('lab', 'a.md')]);
        expect(before).toEqual([sourceChannel('lab', 'a.md')]);

        expect(selectWorkspace(world.state, world.two)).toEqual({ ok: true });
        clock.tick();

        expect(context.workspace.open().roots.map((one) => one.key)).toEqual(['lab', 'claude']);
        expect(seen.portfolioOpen().folders.map((one) => one.name)).toEqual(['lab', 'claude']);
        expect(seen.portfolioHeard).toBeGreaterThan(0);
        expect(seen.appsHeard).toBe(1);
        expect(seen.hostsHeard).toBe(1);
        expect(seen.hostsOpen().roots.map((one) => one.key)).toEqual(['lab', 'claude']);
        expect(seen.gitRoots()).toEqual([world.lab, world.claude]);
        expect(seen.gitHeard).toBe(1);
        expect(seen.relayRoots().map((one) => one.key)).toEqual(['lab', 'claude']);
        expect(seen.relayCalls.reconcile).toBeGreaterThanOrEqual(1);
        expect(seen.watchedLocal).toEqual([[world.research], [world.lab]]);
        expect(context.openFiles.subscribed(silent, [sourceChannel('lab', 'a.md')])).toEqual([]);
        expect(context.workspace.open().recent.map((one) => one.path)).toEqual([
            world.two,
            world.one
        ]);
        expect(readState(world.state).state.recent).toEqual([world.two, world.one]);
    });

    it('keeps the port in force and gives the Findings view a finding naming the key and the restart', () => {
        const world = started();
        const said = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(world.context.local.port).toBe(8800);
        expect(world.seen.portfolioHeld()).toEqual([]);

        selectWorkspace(world.state, world.two);
        world.clock.tick();

        expect(world.context.local.port).toBe(8800);
        const text = textCatalog(loadConfig(world.engine).config);
        expect(world.seen.portfolioHeld()).toEqual([
            {
                file: join(world.lab, '.oculus', 'local.yml'),
                key: 'port',
                message: words(text, 'server.workspace.restart_key', 'port')
            }
        ]);
        expect(world.seen.portfolioHeld()[0]?.message).toContain('restart');
        const lines = said.mock.calls.map((call) => String(call[0]));
        expect(lines.every((line) => !line.includes('8801'))).toBe(true);
    });
});

describe('the server context after a hand edit of the open file', () => {
    it('serves a folder added to the file from the next poll on', () => {
        const world = started();
        const extra = join(world.notes, '..', 'extra');
        mkdirSync(extra);
        writeFileSync(
            world.one,
            `folders:\n  - { name: research-hub, path: ${world.research} }\n  - { name: notes, path: ${world.notes} }\n  - { name: extra, path: ${extra} }\nprimary: research-hub\n`
        );
        world.clock.tick();
        expect(world.context.workspace.open().roots.map((one) => one.key)).toEqual([
            'research-hub',
            'notes',
            'extra'
        ]);
        expect(world.seen.gitRoots()).toEqual(repositoryRoots(world.context.workspace.open()));
        expect(world.seen.portfolioHeard).toBe(1);
        expect(world.seen.relayRoots().map((one) => one.key)).toEqual([
            'research-hub',
            'notes',
            'extra'
        ]);
    });
});

describe('the server context after a switch to a workspace with no primary', () => {
    it('names the open workspace file in the finding of the port it keeps', () => {
        const world = started();
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const three = join(world.research, '.oculus', 'workspaces', 'three.yml');
        writeFileSync(three, `folders:\n  - { name: notes, path: ${world.notes} }\n`);

        selectWorkspace(world.state, three);
        world.clock.tick();

        expect(world.context.workspace.open().primary).toBeNull();
        expect(world.context.local.port).toBe(8800);
        expect(world.seen.portfolioHeld().map((one) => [one.file, one.key])).toEqual([
            [three, 'port']
        ]);
    });
});

describe('the values the server context holds between changes', () => {
    it('serves the open workspace as held until the poll sees the state file change', () => {
        const world = started();
        const keys = () => world.context.workspace.open().roots.map((one) => one.key);
        expect(keys()).toEqual(['research-hub', 'notes']);

        selectWorkspace(world.state, world.two);
        expect(keys()).toEqual(['research-hub', 'notes']);

        world.clock.tick();
        expect(keys()).toEqual(['lab', 'claude']);
    });

    it("serves the machine's values as held until a change of a hub's local.yml is heard", () => {
        const world = started();
        expect(world.context.machine().claudeBin).toBe('claude');

        writeFileSync(
            join(world.research, '.oculus', 'local.yml'),
            'port: 8800\nclaude_bin: other\n'
        );
        expect(world.context.machine().claudeBin).toBe('claude');

        world.seen.localChanged();
        expect(world.context.machine().claudeBin).toBe('other');
    });
});
