// Layer 2, server test support. Stand-ins that let a test build a `ServerContext` with
// `createServerContext` and nothing polling, listening or reading the machine: an inert object for
// each watcher and poller, an apps watcher that holds no app, a scratch copy of the engine's config
// folder, a scratch state folder, and the read of the machine's values.

import { cpSync } from 'node:fs';
import { join } from 'node:path';
import { engineDir, readMachine } from '../../../src/lib/data/sources/config.ts';
import type { ContextDependencies } from '../../../src/lib/server/root/context.ts';
import { noApps } from '../../../src/lib/server/machine/apps/read/held.ts';
import { scratchDir } from '../../fixtures/scratch.ts';

/** An object whose every method does nothing and answers nothing, for a watcher nothing reads. */
export function inert(): never {
    return new Proxy(
        {},
        { get: (_target, name) => (name === 'then' ? undefined : () => undefined) }
    ) as never;
}

/** The apps watcher stand-in: it holds no app and lets the hosts register their listeners. */
export function inertApps(): never {
    const base = inert() as Record<string, unknown>;
    const listener = (): (() => void) => () => undefined;
    return new Proxy(base, {
        get: (target, name) =>
            name === 'held'
                ? noApps
                : name === 'onRead' || name === 'onStores'
                  ? listener
                  : (Reflect.get(target, name) as unknown)
    }) as never;
}

/** The dependencies of a context with no watcher, no poller and no language server. */
export function inertDependencies(): Partial<ContextDependencies> {
    return {
        stateFolder: () => scratchDir('oculus-inert-state-'),
        createTerminals: () => inert(),
        createRelay: () => inert(),
        createDebug: () => inert(),
        watchSessions: () => inert(),
        watchGit: () => inert(),
        watchAutofetch: () => inert(),
        watchBookmarks: () => inert(),
        watchSchedules: () => inert(),
        watchHpc: () => inert(),
        watchProcesses: () => inert(),
        watchCalendar: () => inert(),
        watchMail: () => inert(),
        watchLocal: () => inert(),
        watchApps: () => inertApps(),
        watchUsageRefresh: () => inert(),
        watchUsage: () => inert()
    };
}

/**
 * The `readMachine` dependency that moves every machine-local file of the config under `engine`, so
 * a context built over it writes nothing under the home folder.
 */
export function scratchReadMachine(engine: string): ContextDependencies['readMachine'] {
    return (hubs, primary, warn) => {
        const read = readMachine(hubs, primary, warn);
        const files = {
            approvals: join(engine, 'approvals.json'),
            history: join(engine, 'history'),
            changes: join(engine, 'changes.jsonl')
        };
        return { ...read, config: { ...read.config, ...files } };
    };
}

/** A scratch engine holding a copy of the real engine's config folder. */
export function scratchEngine(prefix: string): string {
    const engine = scratchDir(prefix);
    cpSync(join(engineDir(), 'config'), join(engine, 'config'), { recursive: true });
    return engine;
}
