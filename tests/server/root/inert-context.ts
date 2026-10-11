// Layer 2, server test support. Stand-ins that let a test build a `ServerContext` with
// `createServerContext` and nothing polling, listening or reading the machine: an inert object for
// each watcher and poller, an apps watcher that holds no app, a scratch copy of the engine's
// config folder without its machine-local file, and the read of that folder's local files.

import { cpSync } from 'node:fs';
import { basename, join } from 'node:path';
import { engineDir, readLocal } from '../../../src/lib/data/sources/config.ts';
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
function inertApps(): never {
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

/** The `readLocal` dependency that moves every machine-local file of the config under `engine`. */
export function scratchReadLocal(engine: string): ContextDependencies['readLocal'] {
    return (folder, warn) => {
        const read = readLocal(folder, warn);
        const files = {
            workspaces: join(engine, 'workspaces.json'),
            approvals: join(engine, 'approvals.json'),
            bookmarks: join(engine, 'bookmarks.yml'),
            history: join(engine, 'history'),
            changes: join(engine, 'changes.jsonl'),
            notes: join(engine, 'notes')
        };
        return { ...read, config: { ...read.config, ...files } };
    };
}

/** A scratch engine holding the real engine's config folder without its machine-local file. */
export function scratchEngine(prefix: string): string {
    const engine = scratchDir(prefix);
    cpSync(join(engineDir(), 'config'), join(engine, 'config'), {
        recursive: true,
        filter: (source) => basename(source) !== 'local.yml'
    });
    return engine;
}
