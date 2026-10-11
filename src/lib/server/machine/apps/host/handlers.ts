// Layer 2, server. What oculus answers to the requests a host makes: its store, its secrets, a
// message to its pages and the API of an app it depends on. Each handler reads the app from the
// host that asked, never from the params, so a host reaches its own store and secrets and nothing
// else. A refusal is a `Refused` with the word the host's promise rejects with.
//
// The store is the one file `getStore` and `setStore` read and write; `update` is one key of it,
// counted under `apps.writes_per_min` per host. A secret's store and delete count under the same
// limit, and a message to a page under `apps.messages_per_min`. A message goes to the tab it names,
// or to every open tab of the app when it names none.

import { isDeepStrictEqual } from 'node:util';
import { isMap } from '../../../../data/helpers/guards.ts';
import type { Limiter } from '../../../../data/helpers/run/limiter.ts';
import type { AppMessage } from '../../../../data/model/index.ts';
import type { HeldApp } from '../read/held.ts';
import type { AppSecrets } from '../secrets/secrets.ts';
import { Refused, type HostHandler } from './connection.ts';

/** What a host reads and writes of its app's store. */
export type HostStore = {
    /** The map the store holds now; empty for any other value. */
    get(app: HeldApp): Record<string, unknown>;
    update(
        app: HeldApp,
        key: unknown,
        value: unknown
    ): Promise<{ ok: true } | { ok: false; word: string }>;
};

/** What the handlers of one host are made over. */
export type HandlerContext = {
    /** The app the host belongs to as the server holds it now. */
    app: () => HeldApp | undefined;
    store: HostStore;
    secrets: AppSecrets;
    writes: Limiter;
    messages: Limiter;
    /** The values the host is writing now by key, so a change it made itself is not told back. */
    wrote: Map<string, unknown>;
    send: (message: AppMessage) => void;
    /** The functions of the API of a dependency, or a refusal. */
    names: (name: string) => Promise<string[]>;
    /** One call of the API of a dependency, or a refusal. */
    call: (name: string, fn: string, args: unknown[]) => Promise<unknown>;
};

/** The params as a map, or a refusal. */
function paramsOf(params: unknown): Record<string, unknown> {
    if (!isMap(params)) throw new Refused('refused:params');
    return params;
}

/** The answer of a secrets call as the host sees it. */
function secretly<T>(answer: { ok: true; value: T } | { ok: false; word: string }): T {
    if (!answer.ok) throw new Refused(answer.word);
    return answer.value;
}

/** The handlers of the requests one host makes, by method. */
export function hostHandlers(context: HandlerContext): Record<string, HostHandler> {
    const app = (): HeldApp => {
        const held = context.app();
        if (held === undefined) throw new Refused('host_down');
        return held;
    };
    return {
        'oculus/store/get': (params) => {
            const key = paramsOf(params).key;
            const map = context.store.get(app());
            const has = typeof key === 'string' && Object.hasOwn(map, key);
            return has ? { has, value: map[key] } : { has };
        },
        'oculus/store/keys': () => Object.keys(context.store.get(app())),
        'oculus/store/update': async (params) => {
            const { key, value } = paramsOf(params);
            if (!context.writes.take()) throw new Refused('rate');
            if (typeof key === 'string') context.wrote.set(key, value);
            try {
                const done = await context.store.update(app(), key, value);
                if (!done.ok) throw new Refused(done.word);
            } finally {
                if (typeof key === 'string') context.wrote.delete(key);
            }
            return null;
        },
        'oculus/secrets/get': async (params) =>
            secretly(await context.secrets.get(app(), paramsOf(params).key)) ?? null,
        'oculus/secrets/store': async (params) => {
            if (!context.writes.take()) throw new Refused('rate');
            const { key, value } = paramsOf(params);
            return secretly(await context.secrets.store(app(), key, value));
        },
        'oculus/secrets/delete': async (params) => {
            if (!context.writes.take()) throw new Refused('rate');
            return secretly(await context.secrets.delete(app(), paramsOf(params).key));
        },
        'oculus/sendToPage': (params) => {
            const { method, params: body, tab } = paramsOf(params);
            if (typeof method !== 'string' || method === '') throw new Refused('refused:method');
            if (tab !== undefined && tab !== null && typeof tab !== 'string') {
                throw new Refused('refused:tab');
            }
            if (!context.messages.take()) throw new Refused('rate');
            context.send({ app: app().id, tab: tab ?? '', method, params: body ?? null });
            return null;
        },
        'oculus/apps/get': async (params) => {
            const name = paramsOf(params).name;
            if (typeof name !== 'string') throw new Refused('not_declared');
            return context.names(name);
        },
        'oculus/apps/call': async (params) => {
            const { name, fn, args } = paramsOf(params);
            if (typeof name !== 'string' || typeof fn !== 'string')
                throw new Refused('not_declared');
            if (!Array.isArray(args)) throw new Refused('refused:args');
            return context.call(name, fn, args as unknown[]);
        }
    };
}

/** The keys of a store map whose values differ between two maps, each key once. */
export function changedKeys(
    before: Record<string, unknown>,
    after: Record<string, unknown>
): string[] {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].filter(
        (key) =>
            Object.hasOwn(before, key) !== Object.hasOwn(after, key) ||
            !isDeepStrictEqual(before[key], after[key])
    );
}
