// Layer 4, test helper. A fake server for the source store: files held by root and path, the page's
// reads and saves answered as the server answers them (a save carrying a base the file no longer
// holds is refused `changed`), and the file's channel told what another program did to it. The
// source store is made over it with no client around it, so a case sees exactly what the store
// sent and what each tab holds. `settled` waits on the requests: every read and save the store
// made, until the store has taken the whole answer in.

import { createHash } from 'node:crypto';
import { SvelteMap } from 'svelte/reactivity';
import { vi } from 'vitest';
import type { Message } from '../../../src/lib/data/model/index.ts';
import {
    createSource,
    type SourceDeps
} from '../../../src/lib/state/sessions/source/source.svelte.ts';
import type {
    InstanceStates,
    WriteAnswer,
    WritesStore
} from '../../../src/lib/state/shared/stores/shapes.ts';

export const hashOf = (content: string): string =>
    createHash('sha256').update(content).digest('hex');

/** What a fake server holds and what the page sent it. */
export function server(
    options: Partial<Pick<SourceDeps, 'rules' | 'kept' | 'roots' | 'served' | 'rootsFailed'>> = {}
) {
    const files = new Map<string, string>();
    /** Files held as bytes, for a file that is not UTF-8 text; a key held here is read here. */
    const raw = new Map<string, Uint8Array>();
    /** The places where a folder is, which a save that makes the file there is refused for. */
    const folders = new Set<string>();
    /** The file reads the page made, by address. */
    const fileReads: string[] = [];
    const sent: Record<string, unknown>[] = [];
    const listeners = new Map<string, (message: Message) => void>();
    const subscribed: string[] = [];
    const unsubscribed: string[] = [];
    const states = new SvelteMap<string, unknown>();
    const versions = new Map<string, number>();
    const ui: InstanceStates = {
        instanceState: (id) => states.get(id),
        setInstanceState: (id, state) => void states.set(id, state),
        clearInstanceState: (id) => void states.delete(id),
        instanceKeys: (prefix) => [...states.keys()].filter((key) => key.startsWith(prefix))
    };
    const socket = {
        subscribe: (names: string[]) => void subscribed.push(...names),
        unsubscribe: (names: string[]) => void unsubscribed.push(...names),
        listen: (channel: string, fn: (message: Message) => void) => {
            listeners.set(channel, fn);
            return () => void listeners.delete(channel);
        }
    };

    /** Say what the channel of a file carries: a hash, or null for a file that is gone. */
    function say(key: string, hash: string | null): void {
        const version = (versions.get(key) ?? 0) + 1;
        versions.set(key, version);
        listeners.get(`source:${key}`)?.({
            channel: `source:${key}`,
            version,
            payload: { hash }
        });
    }

    /** The channel's message for a file: the hash of what it holds now, null when it is gone. */
    function tell(key: string): void {
        const content = files.get(key);
        say(key, content === undefined ? null : hashOf(content));
    }

    /** What the save route answers for a body, with the compare against the base it carries. */
    function answer(body: Record<string, unknown>, before?: () => void): WriteAnswer {
        const key = `${String(body.root)}/${String(body.path)}`;
        const held = files.get(key);
        const refused = { ok: false, changed: [], refused: [], error: 'changed', code: 'changed' };
        if (folders.has(key) && body.create === true) {
            return { ...refused, refused: [{ field: 'path', reason: 'folder' }] };
        }
        if (held === undefined && body.create !== true) {
            return body.base === undefined
                ? { ok: false, changed: [], refused: [], error: 'the file is not there' }
                : { ...refused, refused: [{ field: 'base', reason: 'changed' }] };
        }
        if (typeof body.base === 'string' && held !== undefined && hashOf(held) !== body.base) {
            return { ...refused, refused: [{ field: 'base', reason: 'changed' }] };
        }
        const content = String(body.content);
        files.set(key, content);
        before?.();
        return { ok: true, changed: [], refused: [], hash: hashOf(content) };
    }

    /** The requests whose answer the store has not finished taking in. */
    const open = new Set<Promise<void>>();

    /** Count a request as open; the function it returns says the store has the whole answer. */
    function begin(): () => void {
        let finish = (): void => undefined;
        const request = new Promise<void>((resolve) => (finish = resolve));
        open.add(request);
        return () => {
            open.delete(request);
            finish();
        };
    }

    /** An answer whose request ends when the reader has pulled the last of its body. */
    function answered(body: string | Uint8Array, end: () => void): Response {
        const bytes = typeof body === 'string' ? new TextEncoder().encode(body) : body;
        let given = false;
        return new Response(
            new ReadableStream({
                pull(controller) {
                    if (!given) {
                        given = true;
                        controller.enqueue(bytes);
                        return;
                    }
                    controller.close();
                    end();
                }
            })
        );
    }

    let own: ((key: string) => void) | null = null;
    const writes = {
        send: (body: Record<string, unknown>) => {
            sent.push(body);
            const end = begin();
            const key = `${String(body.root)}/${String(body.path)}`;
            return Promise.resolve(answer(body, () => own?.(key))).finally(end);
        }
    } as unknown as WritesStore;

    vi.stubGlobal('fetch', (url: string) => {
        const end = begin();
        if (url.startsWith('/api/source')) {
            return Promise.resolve(answered(JSON.stringify({ ok: true, readonly: false }), end));
        }
        const key = decodeURIComponent(url.replace('/api/file/', ''));
        fileReads.push(key);
        const content = raw.get(key) ?? files.get(key);
        if (content === undefined) {
            end();
            return Promise.resolve(new Response('', { status: 404 }));
        }
        return Promise.resolve(answered(content, end));
    });

    const source = createSource(writes, ui, () => undefined, {
        socket,
        rules: options.rules ?? (() => ({ trim: false, finalNewline: false, formatOnSave: false })),
        kept: options.kept ?? (() => []),
        roots: options.roots ?? (() => []),
        served: options.served ?? (() => null),
        rootsFailed: options.rootsFailed ?? (() => false)
    });
    return {
        files,
        raw,
        folders,
        fileReads,
        sent,
        subscribed,
        unsubscribed,
        states,
        ui,
        source,
        /** Another program wrote the file (or took it away with null), and the channel says so. */
        outside(key: string, content: string | null): void {
            if (content === null) files.delete(key);
            else files.set(key, content);
            tell(key);
        },
        /** The channel carries this hash for the file, as for a message the page did not read. */
        said(key: string, hash: string | null): void {
            say(key, hash);
        },
        /** The save route tells the channel of the tab's own write before it answers. */
        tellOwnWrites(): void {
            own = tell;
        },
        /**
         * Wait until no read or save is open and none starts in the turn after the last one ended,
         * which is when the store's continuations of that answer have run.
         */
        async settled(): Promise<void> {
            for (;;) {
                if (open.size > 0) {
                    await Promise.all([...open]);
                    continue;
                }
                await new Promise<void>((resolve) => setTimeout(resolve, 0));
                if (open.size === 0) return;
            }
        }
    };
}
