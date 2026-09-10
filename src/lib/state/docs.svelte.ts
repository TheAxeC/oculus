// Layer 2, client state. The documents the project view shows, one entry per project and name.
//
// DESIGN.md's wire model keeps documents out of the snapshot, so a document is fetched rather than
// selected: document(id, name) asks api/docs the first time a pair is wanted and holds the answer,
// and every later call for that pair reads what is held. The fetch is scheduled on a microtask
// rather than run inside the call, so reading this from a $derived never writes state while a
// derived is running.
//
// The portfolio's version is what makes a document stale: the server republishes the snapshot when
// a file under a project folder changes, so an edited README is a new version, and invalidate()
// drops what is held for that project. Nothing re-fetches on its own; the next call for the pair
// does, which is the tab being shown again.

import { message } from './entities.svelte.ts';

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

const held: Record<string, DocState> = $state({});

/** The portfolio version each held pair was fetched at. Not reactive: only requests read it. */
const versions: Record<string, number> = {};

/** The pairs with a request in flight, so a second render does not send a second request. */
const inflight = new Set<string>();

/** A project id is a folder basename and a name is one of four literals, so neither holds a bar. */
function keyOf(id: string, name: string): string {
    return `${id}|${name}`;
}

/** The version of the portfolio payload, or 0 before the first one arrives. */
function version(): number {
    return message('portfolio')?.version ?? 0;
}

/**
 * One document of one project. The first call for a pair asks the server; a call made after the
 * portfolio's version moved asks again, and what is held keeps showing until the answer lands.
 */
export function document(id: string, name: string): DocState {
    if (id === '' || name === '') return NOTHING;
    const key = keyOf(id, name);
    const doc = held[key];
    const at = version();
    if (doc === undefined || versions[key] !== at) request(id, name, at);
    return doc ?? PENDING;
}

/** Forget every document held for one project, so the next call for one fetches it again. */
export function invalidate(id: string): void {
    const prefix = `${id}|`;
    for (const key of Object.keys(held)) {
        if (key.startsWith(prefix)) delete held[key];
    }
    for (const key of Object.keys(versions)) {
        if (key.startsWith(prefix)) delete versions[key];
    }
}

/** Schedule one fetch, off the caller's stack so no state is written inside a derived. */
function request(id: string, name: string, at: number): void {
    const key = keyOf(id, name);
    if (inflight.has(key)) return;
    inflight.add(key);
    queueMicrotask(() => {
        void load(id, name, at);
    });
}

async function load(id: string, name: string, at: number): Promise<void> {
    const key = keyOf(id, name);
    try {
        // A version that moved is the project's documents changing, not this pair's alone: the
        // snapshot says nothing about which file was written.
        if (versions[key] !== undefined && versions[key] !== at) invalidate(id);
        versions[key] = at;
        // There is no fetch while the page is rendered on the server, and nothing to show there
        // either: the pair stays pending and the browser asks for it on the first client render.
        if (typeof fetch !== 'function') return;
        const url = `/api/docs?project=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
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
