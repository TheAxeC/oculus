// Layer 2, client state. The documents the views draw: a project's, one of the hub's own, and the
// manual, each held under a key of its own.
//
// DESIGN.md's wire model keeps documents out of the snapshot, so a document is fetched rather than
// selected: document(id, name) asks api/docs the first time a pair is wanted and holds the answer,
// and every later call for that pair reads what is held. hubDocument(path) and manual() are the
// same rule over the other two shapes the endpoint answers. The fetch is scheduled on a microtask
// rather than run inside the call, so reading this from a $derived never writes state while a
// derived is running.
//
// The `files` channel's version is what makes a document stale: the git watcher publishes on it
// each time it re-reads a root, which is every write under a folder it watches, so an edited README
// is a new version, and invalidate() drops what is held for that project. The portfolio's version
// cannot answer this, since the snapshot is rebuilt only for a file the config names. Nothing
// re-fetches on its own; the next call for the pair does, which is the tab being shown again.

import type { EntitiesStore } from '../client/entities.svelte.ts';

/** One document as the view reads it: the rendered HTML, its frontmatter, or what went wrong. */
export type DocState = {
    html: string;
    frontmatter: Record<string, unknown> | null;
    /** What the request failed with, or the empty string. */
    error: string;
    /** True while the first answer for the pair is still to come. */
    loading: boolean;
};

/** What a pair reads as before its answer arrives. */
const PENDING: DocState = { html: '', frontmatter: null, error: '', loading: true };

/** What no pair at all reads as: an empty id or name asks nothing and waits for nothing. */
const NOTHING: DocState = { html: '', frontmatter: null, error: '', loading: false };

/** One rendered document per project and name, held for one client. */
export type DocsStore = {
    document: (id: string, name: string) => DocState;
    /** One Markdown document of the hub, by its path relative to the hub. */
    hubDocument: (path: string) => DocState;
    /** Oculus's own manual, which the server reads from the engine directory. */
    manual: () => DocState;
    invalidate: (id: string) => void;
};

/** The endpoint every document is read at. */
const DOCS = '/api/docs';

/** What the two documents that are not a project's are held under; a project id holds no bar. */
const HUB = 'hub';
const MANUAL = 'manual';

export function createDocs(entities: EntitiesStore): DocsStore {
    const held: Record<string, DocState | undefined> = $state({});

    /** The portfolio version each held pair was fetched at. Not reactive: only requests read it. */
    const versions: Record<string, number | undefined> = {};

    /** The pairs with a request in flight, so a second render does not send a second request. */
    const inflight = new Set<string>();

    /**
     * What one document is held under. A project id is a folder basename and a name is one of four
     * literals, so neither holds a bar. The hub's documents and the manual are held under a key
     * that opens with a bar, which no project's key does since an id is never empty, so a project
     * folder named `hub` or `manual` is a different key and invalidating it leaves them alone.
     */
    function keyOf(id: string, name: string): string {
        return `${id}|${name}`;
    }

    /** The key of a document that belongs to no project. */
    function ownKey(kind: string, name: string): string {
        return `|${kind}|${name}`;
    }

    /**
     * The version of the `files` channel, or 0 before a write has been seen under any watched root.
     */
    function version(): number {
        return entities.message('files')?.version ?? 0;
    }

    /**
     * One document of one project. The first call for a pair asks the server; a call made after the
     * `files` version moved asks again, and what is held keeps showing until the answer lands.
     */
    function document(id: string, name: string): DocState {
        if (id === '' || name === '') return NOTHING;
        return reading(
            keyOf(id, name),
            `${DOCS}?project=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`
        );
    }

    /** One Markdown document of the hub, by the path the rail's `docs:` entry names. */
    function hubDocument(path: string): DocState {
        if (path === '') return NOTHING;
        return reading(ownKey(HUB, path), `${DOCS}?hub=${encodeURIComponent(path)}`);
    }

    /** The manual, which is one document and takes no path. */
    function manual(): DocState {
        return reading(ownKey(MANUAL, MANUAL), `${DOCS}?${MANUAL}=1`);
    }

    /** What is held for one address, asking for it when nothing is held or the version moved. */
    function reading(key: string, url: string): DocState {
        const doc = held[key];
        const at = version();
        if (doc === undefined || versions[key] !== at) request(key, url, at);
        return doc ?? PENDING;
    }

    /** Forget every document held for one project, so the next call for one fetches it again. */
    function invalidate(id: string): void {
        const prefix = `${id}|`;
        for (const key of Object.keys(held)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
            if (key.startsWith(prefix)) delete held[key];
        }
        for (const key of Object.keys(versions)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
            if (key.startsWith(prefix)) delete versions[key];
        }
    }

    /** Schedule one fetch, off the caller's stack so no state is written inside a derived. */
    function request(key: string, url: string, at: number): void {
        if (inflight.has(key)) return;
        inflight.add(key);
        queueMicrotask(() => {
            void load(key, url, at);
        });
    }

    async function load(key: string, url: string, at: number): Promise<void> {
        try {
            // A version that moved is the project's documents changing, not this pair's alone: the
            // snapshot says nothing about which file was written.
            const id = key.slice(0, key.indexOf('|'));
            if (versions[key] !== undefined && versions[key] !== at) invalidate(id);
            versions[key] = at;
            // There is no fetch while the page is rendered on the server, and nothing to show there
            // either: the pair stays pending and the browser asks for it on the first client
            // render.
            if (typeof fetch !== 'function') return;
            const response = await fetch(url);
            const body = (await response.json()) as {
                html?: string;
                frontmatter?: unknown;
                error?: string;
            };
            if (!response.ok) {
                held[key] = {
                    ...PENDING,
                    error: body.error ?? String(response.status),
                    loading: false
                };
                return;
            }
            held[key] = {
                html: typeof body.html === 'string' ? body.html : '',
                frontmatter: readFrontmatter(body.frontmatter),
                error: '',
                loading: false
            };
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            held[key] = { ...PENDING, error: reason, loading: false };
        } finally {
            inflight.delete(key);
        }
    }

    function readFrontmatter(value: unknown): Record<string, unknown> | null {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
        return value as Record<string, unknown>;
    }

    return { document, hubDocument, manual, invalidate };
}
