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
// A write is what makes a document stale. The git watcher publishes a `files` message naming the
// watched root each time it re-reads one, and every answer of api/docs names the absolute file it
// read, so a document is marked for a re-read only when the message's root holds its file. A
// message with the empty root (the bookmarks file changed) names no root and marks nothing. A
// message whose version is not the one after the last one heard means messages were merged or
// missed on the way, and their roots are unknown, so it marks every held document. A document
// whose answer named no file (a request the endpoint refused before opening anything) is marked by
// every message that names a root, since nothing tells which root could change it.
//
// A marked document is asked for again on the next call for it, which is the tab still being drawn,
// and what is held keeps being returned while that answer is in flight: the loading state is what
// a document reads as before its first answer and never after. The request carries the entity tag
// of the held answer, a 304 keeps the held object as it is, and an answer equal to the held one
// keeps the held object too, so an unchanged document rebuilds no markup and reloads no figure.

import type { FilesPayload, Message } from '../../data/model/index.ts';
import type { EntitiesStore } from '../shared/stores/shapes.ts';

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
};

/** The endpoint every document is read at. */
const DOCS = '/api/docs';

/** What the two documents that are not a project's are held under; a project id holds no bar. */
const HUB = 'hub';
const MANUAL = 'manual';

/** What api/docs answers in JSON, every field optional since an error answer carries fewer. */
type Body = { html?: string; frontmatter?: unknown; error?: string; file?: unknown };

/** HTTP's answer to a request whose entity tag is still the file's. */
const NOT_MODIFIED = 304;

/**
 * A path's segments with every doubled separator, `.` and `..` resolved, as a string operation: the
 * watcher's root is not normalised on the way to the page, and the server's file path is.
 */
function segments(path: string): string[] {
    const kept: string[] = [];
    for (const part of path.split(/[/\\]/)) {
        if (part === '' || part === '.') continue;
        if (part === '..') kept.pop();
        else kept.push(part);
    }
    return kept;
}

/** Whether a file lies under a root: the root itself, or a path below it. */
export function holds(root: string, file: string): boolean {
    if (root === '' || file === '') return false;
    const base = segments(root);
    const inner = segments(file);
    if (inner.length < base.length) return false;
    return base.every((part, at) => inner[at] === part);
}

/** Whether two answers draw the same document. */
function same(one: DocState, other: DocState): boolean {
    return (
        one.html === other.html &&
        one.error === other.error &&
        one.loading === other.loading &&
        JSON.stringify(one.frontmatter) === JSON.stringify(other.frontmatter)
    );
}

export function createDocs(entities: EntitiesStore): DocsStore {
    const held: Record<string, DocState | undefined> = $state({});

    /**
     * How many times each key was marked stale. It is state, so a reader drawing a document runs
     * again when its key is marked, and asks.
     */
    const marks: Record<string, number | undefined> = $state({});

    /** The mark each held answer was asked at; a held key whose mark moved since is stale. */
    const askedAt: Record<string, number | undefined> = {};

    /** The absolute file each answer named, or the empty string when it named none. */
    const files: Record<string, string | undefined> = {};

    /** The entity tag each answer carried, sent back on the next request for the key. */
    const tags: Record<string, string | undefined> = {};

    /** The pairs with a request in flight, so a second render does not send a second request. */
    const inflight = new Set<string>();

    /** The version of the last `files` message heard, or null before the first. */
    let heard: number | null = null;

    entities.afterReceive((message) => {
        if (message.channel === 'files') filesMoved(message);
    });

    /**
     * What one document is held under. A project id is a folder basename and a name is one of four
     * literals, so neither holds a bar. The hub's documents and the manual are held under a key
     * that opens with a bar, which no project's key does since an id is never empty, so a project
     * folder named `hub` or `manual` is a different key.
     */
    function keyOf(id: string, name: string): string {
        return `${id}|${name}`;
    }

    /** The key of a document that belongs to no project. */
    function ownKey(kind: string, name: string): string {
        return `|${kind}|${name}`;
    }

    /**
     * One document of one project. The first call for a pair asks the server; a call made after a
     * write under the root holding it asks again, and what is held keeps showing until the answer
     * lands.
     */
    function document(id: string, name: string): DocState {
        if (id === '' || name === '') return NOTHING;
        return reading(
            keyOf(id, name),
            `${DOCS}?project=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`
        );
    }

    /** One Markdown document of the hub, by the path its `docs:` entry in layout.yml names. */
    function hubDocument(path: string): DocState {
        if (path === '') return NOTHING;
        return reading(ownKey(HUB, path), `${DOCS}?hub=${encodeURIComponent(path)}`);
    }

    /** The manual, which is one document and takes no path. */
    function manual(): DocState {
        return reading(ownKey(MANUAL, MANUAL), `${DOCS}?${MANUAL}=1`);
    }

    /** What is held for one address, asking for it when nothing is held or it was marked since. */
    function reading(key: string, url: string): DocState {
        const doc = held[key];
        if (doc === undefined || askedAt[key] !== (marks[key] ?? 0)) request(key, url);
        return doc ?? PENDING;
    }

    /**
     * Whether one `files` message can concern the document held under a key: a gap in the versions
     * concerns every document, the empty root none, and a root the ones whose file it holds.
     */
    function concerns(key: string, root: string, gap: boolean): boolean {
        if (gap) return true;
        if (root === '') return false;
        const file = files[key];
        if (file === undefined || file === '') return true;
        return holds(root, file);
    }

    /** Mark every held or requested document a `files` message concerns. */
    function filesMoved(message: Message): void {
        if (heard === message.version) return;
        const gap = heard === null || message.version !== heard + 1;
        heard = message.version;
        const payload = message.payload as FilesPayload | null;
        const root = typeof payload?.root === 'string' ? payload.root : '';
        const keys = new Set([...Object.keys(askedAt), ...inflight]);
        for (const key of keys) {
            if (concerns(key, root, gap)) marks[key] = (marks[key] ?? 0) + 1;
        }
    }

    /** Schedule one fetch, off the caller's stack so no state is written inside a derived. */
    function request(key: string, url: string): void {
        if (inflight.has(key)) return;
        inflight.add(key);
        queueMicrotask(() => {
            void load(key, url);
        });
    }

    /** Hold one answer, keeping the held object when the new one draws the same document. */
    function keep(key: string, next: DocState): void {
        const before = held[key];
        if (before !== undefined && same(before, next)) return;
        held[key] = next;
    }

    async function load(key: string, url: string): Promise<void> {
        const mark = marks[key] ?? 0;
        try {
            // There is no fetch while the page is rendered on the server, and nothing to show there
            // either: the pair stays pending and the browser asks for it on the first client
            // render.
            if (typeof fetch !== 'function') {
                askedAt[key] = mark;
                return;
            }
            const tag = held[key] === undefined ? '' : (tags[key] ?? '');
            const response = await fetch(
                url,
                tag === '' ? undefined : { headers: { 'if-none-match': tag } }
            );
            askedAt[key] = mark;
            if (response.status === NOT_MODIFIED && held[key] !== undefined) return;
            const body = await readBody(response);
            if (body instanceof Error) {
                // The server answered, but with a body that is not the endpoint's (a proxy's page,
                // an empty 5xx): that is news too, so it replaces what is held.
                files[key] = '';
                tags[key] = '';
                const reason = response.ok ? body.message : String(response.status);
                keep(key, { ...PENDING, error: reason, loading: false });
                return;
            }
            files[key] = typeof body.file === 'string' ? body.file : '';
            tags[key] = response.ok ? (response.headers.get('etag') ?? '') : '';
            if (!response.ok) {
                keep(key, {
                    ...PENDING,
                    error: body.error ?? String(response.status),
                    loading: false
                });
                return;
            }
            keep(key, {
                html: typeof body.html === 'string' ? body.html : '',
                frontmatter: readFrontmatter(body.frontmatter),
                error: '',
                loading: false
            });
        } catch (error) {
            // A request that never reached the server (a restart, a dropped connection) says
            // nothing about the file, so a drawn document stays drawn and its mark stays
            // unconsumed: the next message that concerns it asks again.
            const before = held[key];
            if (before?.error === '' && !before.loading) return;
            askedAt[key] = mark;
            tags[key] = '';
            const reason = error instanceof Error ? error.message : String(error);
            keep(key, { ...PENDING, error: reason, loading: false });
        } finally {
            inflight.delete(key);
            // A mark that came while the request was in flight may be a write the answer predates.
            // The reader that ran again on it found the request in flight and asked nothing, and an
            // answer that kept the held object runs no reader, so the key is asked for again here.
            if ((marks[key] ?? 0) !== mark) request(key, url);
        }
    }

    /** The endpoint's JSON body, or the error its parse threw when the body is not JSON. */
    async function readBody(response: Response): Promise<Body | Error> {
        try {
            return (await response.json()) as Body;
        } catch (error) {
            return error instanceof Error ? error : new Error(String(error));
        }
    }

    function readFrontmatter(value: unknown): Record<string, unknown> | null {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
        return value as Record<string, unknown>;
    }

    return { document, hubDocument, manual };
}
